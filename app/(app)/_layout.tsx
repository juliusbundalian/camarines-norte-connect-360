import {stackOptions} from '../../features/navigation/stack-options';
import { Stack } from "expo-router";
export default function AuthenticatedLayout() {
  return <Stack screenOptions={stackOptions} />;
}
