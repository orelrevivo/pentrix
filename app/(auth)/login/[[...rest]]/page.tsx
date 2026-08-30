import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-zinc-950 p-4">
      <SignIn />
    </div>
  );
}
