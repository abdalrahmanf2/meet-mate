import { cn } from "@/lib/utils";

interface ChatProps {
  className?: string;
}

const Chat = ({ className }: ChatProps) => {
  return <div className={cn("", className)}>Chat</div>;
};

export default Chat;
