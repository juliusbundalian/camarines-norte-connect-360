import {Controller,useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {Button,HelperText,TextInput,Text} from 'react-native-paper';
import {View} from 'react-native';
import {router} from 'expo-router';
import {Screen} from '../../components/Screen';
import {PasswordField} from '../../components/PasswordField';
import {FormError} from '../../components/FormError';
import {useAuth} from './AuthProvider';
import {useAsyncAction} from './useAsyncAction';
import {registrationSchema,type RegistrationFields} from './schemas';
export default function RegisterScreen() {
  const {register}=useAuth();const action=useAsyncAction();
  const {control,handleSubmit,formState:{errors}}=useForm<RegistrationFields>({resolver:zodResolver(registrationSchema),defaultValues:{email:'',password:'',confirmPassword:''}});
  const submit=handleSubmit(({email,password})=>action.run(()=>register(email,password)));
  return <Screen title="Create an account">
    <View><Controller control={control} name="email" render={({field})=><TextInput mode="outlined" label="Email" accessibilityLabel="Email" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={!!errors.email} disabled={action.pending}/>}/>{errors.email&&<HelperText type="error">{errors.email.message}</HelperText>}</View>
    <Text variant="bodyMedium">Use at least 8 characters for your password.</Text>
    {(['password','confirmPassword'] as const).map(name=><View key={name}><Controller control={control} name={name} render={({field})=><PasswordField label={name==='password'?'Password':'Confirm Password'} autoComplete="new-password" textContentType="newPassword" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={!!errors[name]} disabled={action.pending} onSubmitEditing={name==='confirmPassword'?()=>void submit():undefined}/>}/>{errors[name]&&<HelperText type="error">{errors[name]?.message}</HelperText>}</View>)}
    <FormError message={action.error}/><Button mode="contained" onPress={()=>void submit()} loading={action.pending} disabled={action.pending}>Register</Button>
    <Button onPress={()=>router.replace('/login')}>Back to Login</Button>
  </Screen>;
}
