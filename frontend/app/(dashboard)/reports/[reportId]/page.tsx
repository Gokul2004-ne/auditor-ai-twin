import ReportClient from './ReportClient'

export function generateStaticParams() {
  return [{ reportId: 'demo' }]
}

export default function Page() {
  return <ReportClient />
}
