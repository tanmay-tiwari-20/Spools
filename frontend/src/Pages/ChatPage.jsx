
const ChatPage = () => {
  return (
    <div className="absolute left-[50%] -translate-x-[50%] md:w-[750px] p-4 w-full">
      <div className="flex gap-4 flex-col md:flex-row max-w-[400px] md:max-w-full mx-auto">
        <div className="flex flex-[30%]">Conversations</div>
        <div className="flex flex-[70%]">Message</div>
      </div>
    </div>
  )
}

export default ChatPage