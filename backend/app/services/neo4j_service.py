from neo4j import GraphDatabase
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class Neo4jService:
    def __init__(self):
        self.driver = None

    async def connect(self):
        if self.driver is None:
            self.driver = GraphDatabase.driver(
                settings.neo4j_uri,
                auth=(settings.neo4j_username, settings.neo4j_password)
            )
            self.driver.verify_connectivity()
            logger.info("Connected to Neo4j")

    def _ensure_driver(self):
        if self.driver is None:
            self.driver = GraphDatabase.driver(
                settings.neo4j_uri,
                auth=(settings.neo4j_username, settings.neo4j_password)
            )
            self.driver.verify_connectivity()

    async def close(self):
        if self.driver:
            self.driver.close()
            self.driver = None

    async def run_query(self, query: str, parameters: dict = None) -> list:
        self._ensure_driver()
        with self.driver.session(database=settings.neo4j_database) as session:
            result = session.run(query, **(parameters or {}))
            return [dict(r) for r in result]

    async def get_all_standards(self) -> list:
        return self.get_standards()

    def get_standards(self) -> list:
        self._ensure_driver()
        with self.driver.session(database=settings.neo4j_database) as session:
            result = session.run(
                "MATCH (s:Standard) RETURN s ORDER BY s.code"
            )
            return [dict(r['s']) for r in result]

    async def get_standard(self, standard_id: str) -> dict | None:
        self._ensure_driver()
        with self.driver.session(database=settings.neo4j_database) as session:
            result = session.run(
                "MATCH (s:Standard {id: $id}) RETURN s",
                id=standard_id
            ).single()
            return dict(result['s']) if result else None

    async def get_clauses_for_standard(self, standard_id: str) -> list:
        return self.get_standard_clauses(standard_id)

    def get_standard_clauses(self, standard_id: str) -> list:
        self._ensure_driver()
        with self.driver.session(database=settings.neo4j_database) as session:
            result = session.run(
                """
                MATCH (s:Standard {id: $standard_id})-[:HAS_CLAUSE]->(c:Clause)
                OPTIONAL MATCH (c)<-[:PARENT_OF]-(parent:Clause)
                RETURN c, parent.id as parent_id
                ORDER BY c.number
                """,
                standard_id=standard_id
            )
            clauses = []
            for r in result:
                clause = dict(r['c'])
                clause['parent_id'] = r['parent_id']
                clauses.append(clause)
            return clauses

    async def get_clause(self, clause_id: str) -> dict | None:
        detail = self.get_clause_detail(clause_id)
        if not detail:
            return None
        # Return composite dict
        res = dict(detail['clause'])
        res['parents'] = detail['parents']
        res['children'] = detail['children']
        res['dependencies'] = detail['dependencies']
        res['related'] = detail['related']
        res['evidence_requirements'] = detail['evidence_requirements']
        res['audit_questions'] = detail['audit_questions']
        res['cross_standard_mappings'] = detail['cross_standard_mappings']
        return res

    def get_clause_detail(self, clause_id: str) -> dict | None:
        self._ensure_driver()
        with self.driver.session(database=settings.neo4j_database) as session:
            result = session.run(
                """
                MATCH (c:Clause {id: $clause_id})
                OPTIONAL MATCH (c)<-[:HAS_CLAUSE|PARENT_OF]-(parent)
                OPTIONAL MATCH (c)-[:PARENT_OF]->(child:Clause)
                OPTIONAL MATCH (c)-[:DEPENDS_ON]->(dep:Clause)
                OPTIONAL MATCH (c)-[:RELATED_TO]->(rel:Clause)
                OPTIONAL MATCH (c)-[:REQUIRES_EVIDENCE]->(ev:EvidenceType)
                OPTIONAL MATCH (c)-[:HAS_AUDIT_QUESTION]->(aq:AuditQuestion)
                OPTIONAL MATCH (c)-[:MAPS_TO]->(mapped:Clause)
                RETURN c,
                    collect(DISTINCT parent) as parents,
                    collect(DISTINCT child) as children,
                    collect(DISTINCT dep) as dependencies,
                    collect(DISTINCT rel) as related,
                    collect(DISTINCT ev) as evidence_requirements,
                    collect(DISTINCT aq) as audit_questions,
                    collect(DISTINCT mapped) as cross_standard_mappings
                """,
                clause_id=clause_id
            )
            record = result.single()
            if not record:
                return None
            return {
                "clause": dict(record['c']),
                "parents": [dict(p) for p in record['parents'] if p],
                "children": [dict(c) for c in record['children'] if c],
                "dependencies": [dict(d) for d in record['dependencies'] if d],
                "related": [dict(r) for r in record['related'] if r],
                "evidence_requirements": [dict(e) for e in record['evidence_requirements'] if e],
                "audit_questions": [dict(aq) for aq in record['audit_questions'] if aq],
                "cross_standard_mappings": [dict(m) for m in record['cross_standard_mappings'] if m],
            }

    async def get_clause_graph(self, clause_id: str, depth: int = 2) -> dict:
        """Return graph data formatted for React Flow."""
        self._ensure_driver()
        with self.driver.session(database=settings.neo4j_database) as session:
            cypher = f"""
                MATCH path = (c:Clause {{id: $clause_id}})-[r*0..{depth}]-(n)
                RETURN nodes(path) as nodes, relationships(path) as rels
            """
            result = session.run(cypher, clause_id=clause_id)
            nodes_seen = {}
            edges = []
            for record in result:
                for node in record['nodes']:
                    nid = node.element_id
                    props = dict(node)
                    clean_id = props.get('id', nid)
                    if clean_id not in nodes_seen:
                        label_name = props.get('title', props.get('name', props.get('question', clean_id)))
                        node_type = list(node.labels)[0] if node.labels else "Node"
                        nodes_seen[clean_id] = {
                            "id": clean_id,
                            "type": "custom" if node_type == "Clause" else "default",
                            "data": {
                                "label": label_name,
                                "type": node_type,
                                **props
                            },
                            "position": {"x": 0, "y": 0}
                        }
                for rel in record['rels']:
                    start = dict(rel.start_node)
                    end = dict(rel.end_node)
                    src_id = start.get('id', '')
                    tgt_id = end.get('id', '')
                    if src_id and tgt_id:
                        edge_id = f"{src_id}_{rel.type}_{tgt_id}"
                        if not any(e['id'] == edge_id for e in edges):
                            edges.append({
                                "id": edge_id,
                                "source": src_id,
                                "target": tgt_id,
                                "label": rel.type,
                            })
            return {"nodes": list(nodes_seen.values()), "edges": edges}

    async def search_clauses(self, query: str, standard_id: str = None) -> list:
        self._ensure_driver()
        with self.driver.session(database=settings.neo4j_database) as session:
            cypher = """
                MATCH (c:Clause)
                WHERE toLower(c.title) CONTAINS toLower($query)
                   OR toLower(c.summary) CONTAINS toLower($query)
                   OR toLower(c.number) CONTAINS toLower($query)
                   OR toLower(c.id) CONTAINS toLower($query)
            """
            params = {"query": query}
            if standard_id:
                cypher += " AND c.standard_id = $standard_id"
                params["standard_id"] = standard_id
            cypher += " RETURN c LIMIT 20"
            result = session.run(cypher, **params)
            return [dict(r['c']) for r in result]


neo4j_service = Neo4jService()
