import { Redirect } from 'expo-router';

export default function LegacyDraftsRoute() {
  return <Redirect href="/trip/browse?filter=drafts" />;
}
