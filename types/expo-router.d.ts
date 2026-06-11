declare module 'expo-router' {
  import { ComponentType } from 'react';

  export const Stack: any;
  export const Tabs: any;
  export const router: any;
  export const useRouter: any;
  export const useLocalSearchParams: any;
  export const useSegments: any;
  export const Link: ComponentType<any>;
  export const Redirect: ComponentType<any>;
  export const useNavigation: any;
  export type Href = string;

  export function usePathname(): string;
}
