import { cn } from "@/lib/utils";

interface ChatProps {
  className?: string;
}

const Chat = ({ className }: ChatProps) => {
  return <div className={cn("p-4 border rounded-lg", className)}>Chat</div>;
};

export default Chat;
