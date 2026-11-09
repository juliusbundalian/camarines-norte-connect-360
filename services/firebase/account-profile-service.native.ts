import type {AuthUser} from './auth-types';
import type {AccountProfileService} from './account-profile-types';
import {profileService} from './profile-service';
import {nativeAccountProfileService} from './native-account-profile-service';
export function getAccountProfileService(source:AuthUser['source']):AccountProfileService {
  return source==='native'?nativeAccountProfileService:profileService;
}
