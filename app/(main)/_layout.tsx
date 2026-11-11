import {stackOptions} from '../../features/navigation/stack-options';
import {Stack} from 'expo-router';
import {MainFonts} from '../../features/navigation/MainFonts';
export const unstable_settings={anchor:'(tabs)'};
export default function MainLayout() {
  return (
    <MainFonts>
      <Stack screenOptions={stackOptions}>
        <Stack.Screen name="property/[id]" options={({route}) => {
          const top = (route.params as {mapCardTop?: unknown} | undefined)?.mapCardTop;
          return typeof top === 'string' && top !== '' && Number.isFinite(Number(top))
            ? {presentation: 'transparentModal', animation: 'none', gestureEnabled: false,
              contentStyle: {backgroundColor: 'transparent'}}
            : {};
        }} />
      </Stack>
    </MainFonts>
  );
}
