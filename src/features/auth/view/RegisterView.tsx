import { useAuthViewModel } from "@/features/auth/viewmodel/useAuthViewModel";
import { router } from "expo-router";
import { Screen, AppHeader, Button, ErrorMessage } from "@/shared/components/ui";
import { Field } from "@/shared/components/fields";

export default function Register() {
  const {name,setName,email,setEmail,password,setPassword,action,submit} = useAuthViewModel("register");
  return (
    <Screen>
      <AppHeader title="Criar conta" subtitle="UM PLANO A DOIS" back />
      <Field label="Seu nome" value={name} onChange={setName} required />
      <Field label="E-mail" value={email} onChange={setEmail} keyboard="email-address" required />
      <Field label="Senha · mínimo 8 caracteres" value={password} onChange={setPassword} secure required />
      <ErrorMessage message={action.error} />
      <Button title={action.busy ? "Criando…" : "Criar conta"} disabled={action.busy} onPress={() => void submit(() => router.replace("/"))} />
      <Button title="Já tenho conta" secondary onPress={() => router.push("/auth/login")} />
    </Screen>
  );
}
