import { MarketStreamProvider } from '@/lib/context';
import { TelaoClient } from './_components';

export default function TelaoPage() {
  return (
    <MarketStreamProvider fallbackToPolling>
      <TelaoClient />
    </MarketStreamProvider>
  );
}
