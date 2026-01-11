import { useState, useEffect } from 'react';
import { getUserQuota, type QuotaInfo } from '../lib/supabase';

/**
 * React Hook: 获取和管理用户配额
 */
export function useQuota() {
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuota = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getUserQuota();
      setQuota(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取配额失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuota();
  }, []);

  return {
    quota,
    loading,
    error,
    refetch: fetchQuota,
  };
}
