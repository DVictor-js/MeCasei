import { useAuthViewModel } from "@/features/auth/viewmodel/useAuthViewModel";
import { router } from "expo-router";
import { Screen, AppHeader, Button, ErrorMessage } from "@/shared/components/ui";
import { Field } from "@/shared/components/fields";

export default function Login() {
  const {email,setEmail,password,setPassword,action,submit} = useAuthViewModel("login");
  return (
    <Screen>
      <AppHeader title="Entrar" subtitle="SUA CONTA" back />
      <Field label="E-mail" value={email} onChange={setEmail} keyboard="email-address" required />
      <Field label="Senha" value={password} onChange={setPassword} secure required />
      <ErrorMessage message={action.error} />
      <Button title={action.busy ? "Entrando…" : "Entrar"} disabled={action.busy} onPress={() => void submit(() => router.replace("/"))} />
      <Button title="Criar conta" secondary onPress={() => router.push("/auth/register")} />
    </Screen>
  );
}
