import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type PropsWithChildren,
} from "react";
interface Feedback {
  message: string;
  notify: (message: string) => void;
}
const Context = createContext<Feedback>({ message: "", notify: () => {} });
export function FeedbackProvider({ children }: PropsWithChildren) {
  const [message, notify] = useState("");
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => notify(""), 4500);
    return () => clearTimeout(timer);
  }, [message]);
  return (
    <Context.Provider value={{ message, notify }}>{children}</Context.Provider>
  );
}
export function useFeedback() {
  return useContext(Context);
}
export function useAction() {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notify } = useFeedback();
  const run = useCallback(
    async (work: () => Promise<void>, success = "Alterações salvas.") => {
      if (lock.current) return;
      lock.current = true;
      setBusy(true);
      setError(null);
      try {
        await work();
        if (success) notify(success);
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Não foi possível salvar. Tente novamente.",
        );
      } finally {
        lock.current = false;
        setBusy(false);
      }
    },
    [notify],
  );
  return { busy, error, run };
}
