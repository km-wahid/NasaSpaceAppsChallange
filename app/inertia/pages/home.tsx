import DataBrowser from '../components/data_browser'
import type { InertiaProps } from '../types'

export default function Home({ user }: InertiaProps) {
  return <DataBrowser signedIn={Boolean(user)} />
}
