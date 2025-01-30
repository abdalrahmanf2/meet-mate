import JoinMeetingForm from "./join-meeting-form";

const JoinMeeting = () => {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-xl font-semibold">Join a Meeting</h3>
        <p className="text-muted-foreground">
          Enter a meeting ID to join an ongoing session.{" "}
        </p>
      </div>

      <div>
        <JoinMeetingForm />
      </div>
    </div>
  );
};

export default JoinMeeting;
