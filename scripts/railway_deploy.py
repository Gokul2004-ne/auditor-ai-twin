import requests
import json

import os
TOKEN = os.environ.get("RAILWAY_TOKEN", "rlwy_wksp_c2lqDfCJOTBBN0aFauzafgcWLqFAvlqfnQ4X4Y4r")
URL = "https://backboard.railway.com/graphql/v2"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def query_gql(query, variables=None):
    res = requests.post(URL, json={"query": query, "variables": variables or {}}, headers=headers)
    return res.json()

if __name__ == "__main__":
    # Introspect serviceDomainCreate
    res = query_gql("""
    query {
        __type(name: "ServiceDomainCreateInput") {
            inputFields {
                name
                type {
                    name
                    kind
                }
            }
        }
    }
    """)
    print("serviceDomainCreate:", json.dumps(res, indent=2))
