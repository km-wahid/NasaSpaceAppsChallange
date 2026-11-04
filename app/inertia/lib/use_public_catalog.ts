import { useEffect, useState } from 'react'
import { api } from './api'
import type { Catalog } from '../components/data_browser'

export function usePublicCatalog() {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [districtId, setDistrictId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    api<Catalog>(
      `/api/v1/catalog${districtId ? `?districtId=${districtId}` : ''}`,
      'GET',
      undefined,
      controller.signal
    )
      .then((data) => {
        if (!controller.signal.aborted) {
          setCatalog(data)
          setDistrictId(String(data.district.district_id))
        }
      })
      .catch((reason) => {
        if (!controller.signal.aborted)
          setError(reason instanceof Error ? reason.message : 'DATA_UNAVAILABLE')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [districtId, retry])

  return {
    catalog,
    districtId,
    setDistrictId,
    loading,
    error,
    retry: () => setRetry((value) => value + 1),
  }
}
