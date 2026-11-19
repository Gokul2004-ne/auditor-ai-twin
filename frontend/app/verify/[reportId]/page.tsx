import VerifyClient from './VerifyClient'

export function generateStaticParams() {
  return [{ reportId: 'demo' }]
}

export default function Page() {
  return <VerifyClient />
}
