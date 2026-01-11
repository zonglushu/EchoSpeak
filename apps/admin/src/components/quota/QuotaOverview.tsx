// 服务端组件
import { getUserQuota, getAllQuotasOverview } from '@/lib/data/quota';
import { QuotaManagementClient } from './QuotaManagementClient';

interface QuotaOverviewProps {
  userId?: string;
}

export async function QuotaOverview({ userId = 'default-user' }: QuotaOverviewProps) {
  // ✅ 在服务端获取配额数据
  const [quota, allQuotas] = await Promise.all([
    getUserQuota(userId),
    getAllQuotasOverview(),
  ]);

  if (!quota) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-red-700">加载配额数据失败</p>
      </div>
    );
  }

  // 将数据传递给客户端组件处理交互
  return <QuotaManagementClient initialQuota={quota} allQuotas={allQuotas} />;
}
