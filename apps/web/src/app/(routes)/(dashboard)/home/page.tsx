import { auth } from "@/auth";
import HoverCard from "@/components/hover-card";
import MeetingCard from "@/components/meeting-card";

const CARD_ITEMS = [
  {
    title: "Creata a New Meeting",
    url: "create-meeting",
    body: "set up a new meeting, invite participants, and much more.",
  },
  {
    title: "Join a Meeting",
    url: "join-meeting",
    body: "Enter a meeting ID to join an ongoing session.",
  },
];

const Home = async () => {
  const session = await auth();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="font-semibold text-2xl">Home</h3>
        <p className="text-muted-foreground">
          Welcome back, {session?.user?.name}!
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {CARD_ITEMS.map((item) => (
          <HoverCard key={item.title} title={item.title} url={item.url}>
            {item.body}
          </HoverCard>
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">
          Scheduled Meetings (Coming Soon)
        </h3>
        <div className="pointer-events-none opacity-50 grid md:grid-cols-2">
          <MeetingCard />
        </div>
      </div>
    </div>
  );
};

export default Home;
