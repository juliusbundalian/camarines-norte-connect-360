import type {ProfileDraft} from './profile-types';
/** Compare raw draft values, including whether the avatar was chosen manually. */
export function sameDraft(a:ProfileDraft,b:ProfileDraft):boolean {
 return a.displayName===b.displayName&&a.birthdateText===b.birthdateText&&a.mobileText===b.mobileText&&a.avatarId===b.avatarId&&a.avatarSelectionSource===b.avatarSelectionSource;
}
