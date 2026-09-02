import { Redirect } from 'expo-router';

export default function LegacyArchiveRoute() {
  return <Redirect href="/trip/browse?filter=previous" />;
}
