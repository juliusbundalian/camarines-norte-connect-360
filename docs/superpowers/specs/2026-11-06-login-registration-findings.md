# Login and registration: inspected requirements

Date:2026-11-06. Current task: implement supplied Figma login/registration and error states, replacing email as the visible identifier with a phone number. User explicitly waived approval of this task's implementation plan only; subsequent plans still require approval. Native execution and Android-first testing remain selected. No application code changed during this investigation.

## Inspected visual targets

File `Y9XPx697YfMPFKkQzblkqc`, page `4004:12526`, Authentication Flow section `4005:14925`. High-fidelity design context/screenshots obtained for:

- Login `4005:14926`; credential error `4005:14940`; account-not-found `4005:14955`; server failure `4005:14970`.
- Registration `4005:15138`; duplicate number `4005:15214`; invalid number `4005:15254`; server failure `4005:15234`.
- Metadata also locates registration OTP steps `4005:15274`, `4005:15297`, `4005:15321`, `4005:15351`, `4005:15371`; inspect their full design context if selected authentication requires them.

Reference412×892 including simulated52px status and24px gesture bars. Use real Android system bars. Background#F5F5F9,16dp content padding/gaps,48dp back action,56dp fields,48dp submission button, input borders rgba(34,48,62,.22), text rgba(34,48,62,.9/.7/.4), green#39B54A and amber#FFAB00. Public Sans Regular/Medium (resolved directly from text nodes), heading24/32, body16/24 tracking.5, labels14/20 tracking.1, password checklist12/16 tracking.4.

Login contains +63 mobile field, password visibility, Forgot Password, Login, Sign up. Registration contains +63 mobile field, password/confirmation, five password-rule indicators, agreement checkbox/Terms link, Sign up and Login navigation. No extra profile fields shown in these initial registration frames. Authentication design uses actual signup OTP after registration. Later profile/location/Home/menu screens remain outside this task.

Error alert layout is a rounded pale-red block above the fields with warning icon, primary message and optional supporting text. Inputs remain available for correction. Existing safe credential errors must remain neutral if Firebase does not distinguish nonexistent account/wrong password; do not fake server error reference IDs or infer account existence from client probes. Backend/error failures must reflect actual supported authentication operations. Support local required/format/password confirmation validation, loading/duplicate-submit guards, network/service failure, retry, and other applicable provider errors.

## Live Firebase read-only finding

Using Firebase JS SDK `validatePassword` with a synthetic candidate (no user creation, signin, or email/SMS transmission), the live project's policy was confirmed as ENFORCE: minimum8, maximum4096, uppercase, lowercase, numeric and non-alphanumeric characters required. Do not change this policy. No local google-services.json currently exists in the project. Live account/session data must be preserved; no live SMS testing is authorized by a designated test number yet.

## Required authentication-model clarification

Firebase's native Phone provider verifies an SMS credential. Its email/password provider supports a password policy; enabling Phone and password policy does not create phone-number-plus-password sign-in. A phone/password custom authentication backend would have to manage password verification/policy and recovery itself. Do not invent synthetic email addresses, client-side credential storage, or a backend implicitly to bridge these providers.

An asynchronous question asks the user to select phone+SMS (recommended), email/password with verified phone, or phone/password with custom backend. A second question requests the approved Terms URL/text. These are missing product/authentication inputs, not another plan approval checkpoint. Continue from the user's answers, then write the concrete implementation plan and execute without requesting plan approval again for this task. Select the smallest supported architecture for that answer, preserve prior behavior deliberately, and obtain the required independent review before handover.

## User clarification received

User selected phone number+SMS code and requested a native Terms page with contents to follow. This task alone has a plan approval waiver. Password-based fields/requirements are therefore removed from the new phone flow. Terms is an explicitly pending-content placeholder with no acceptance claim.

### Desktop fallback inspection (2026-11-06)
Figma desktop search for OTP found five 412×892 frames, but these contain gender, interests, profile completion and avatar selection, not SMS code entry. Inspected 4005:15274 and 4005:15371 visually. They are outside the approved login/signup scope and are not implemented. The necessary SMS code screen uses the inspected auth typography/colors/spacing with a simple accessible six-digit input; it is a functional SMS adaptation, not a claim of an exact supplied OTP design.
