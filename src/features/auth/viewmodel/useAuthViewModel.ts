import { useState } from "react";
import { useSession } from "@/core/session/SessionProvider";
import { useAction } from "@/shared/viewmodel/useAction";
export function useAuthViewModel(mode: "login" | "register" | "local") {
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const session=useSession();
  const action=useAction();
  async function submit(onSuccess: () => void) {
    await action.run(async () => {
      if(mode === "local") await session.continueLocal();
      else if(mode === "login") {
        if(!email.trim() || !password) throw new Error("Informe e-mail e senha.");
        await session.login(email.trim(),password);
      } else {
        if(!name.trim() || !email.trim() || password.length < 8) throw new Error("Informe nome, e-mail e uma senha de ao menos 8 caracteres.");
        await session.register(name.trim(),email.trim(),password);
      }
      onSuccess();
    });
  }
  return {name,setName,email,setEmail,password,setPassword,action,submit};
}
