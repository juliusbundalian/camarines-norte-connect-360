import type {AuthUser} from './auth-types';
import type {AccountProfileService} from './account-profile-types';
import {profileService} from './profile-service';
export function getAccountProfileService(source:AuthUser['source']):AccountProfileService {
  if(source==='js')return profileService;
  // Load the native SDK only when a native-authenticated account needs it.
  const {nativeAccountProfileService}=require('./native-account-profile-service') as typeof import('./native-account-profile-service');
  return nativeAccountProfileService;
}
