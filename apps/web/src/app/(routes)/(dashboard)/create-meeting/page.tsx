import CreateMeetingForm from "./create-meeting-form";

const CreateMeeting = () => {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-xl font-semibold">Create a Meeting</h3>
        <p className="text-muted-foreground">
          set up a new meeting, invite participants, and much more.
        </p>
      </div>

      <div>
        <CreateMeetingForm />
      </div>
    </div>
  );
};

export default CreateMeeting;
