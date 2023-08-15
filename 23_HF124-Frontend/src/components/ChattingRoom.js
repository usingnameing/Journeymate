import React, { useState, useEffect, useContext, useRef } from "react"; 
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faUser,faArrowLeft,faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { SocketContext } from "../App";
import ChattingMessage from "./ChattingMessage";
const baseURL = "http://localhost:3000";

const ChattingRoom = () => {
  const { chatID } = useParams(); // postId 추출
  const socket=useContext(SocketContext);
  const chattingmessages = useContext(ChattingMessage); // 이 코드를 추가합니다.

  const navigate = useNavigate();

  const [roomdata, setRoomdata] = useState("")
  const [messageData, setMessageData] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState(""); // 채팅 입력값 저장
  const [messages, setMessages] = useState([]); // 전송된 채팅 목록 저장

  const endOfMessagesRef = useRef(null);


  // console.log(chattingmessages)
  // console.log(typeof(chattingmessages.roomID))
  // console.log(chattingmessages.userID)
  // console.log(chattingmessages.message)
  
  // const roomNumber = Number(chatID)
  // console.log(roomNumber)

  // 채팅방 정보 가져오기
  useEffect(() => {
    const fetchChatRoom = async () => {
      const response = await axios.get(baseURL + `/chat/chatroomdata/${chatID}`);
      setRoomdata(response)
      console.log(response)
      
    };
    fetchChatRoom();
  }, []);

  // 채팅방 메시지
  useEffect(()=>{
    const fetchMessage=async()=>{
      const message=await axios.get(baseURL+`/chat/${chatID}`);
      setMessageData(message)
    };
    fetchMessage();
  },[])

  
  //console.log(`채팅메시지 ${messageData.data.chatMessage.rows[0].content}`)


  const sendMessage = (message) => {
    socket.emit('chat_message', {roomID: chatID, content: message});
  };

  function openModal() {
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
  }
  const handleOutsideClick = (e) => {
    if (e.target === e.currentTarget) {
      // Check if the target is the ModalBackground
      closeModal();
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value); // 입력값 설정
  };

  const handleSendMessage = () => {
    if (inputValue.trim() !== "") {
      setMessages([...messages, { text: inputValue, self: true }]); // 메시지 객체를 배열에 추가
      sendMessage(inputValue);
      console.log(inputValue);
      setInputValue(""); // 입력값 초기화
      scrollToBottom(); // 스크롤 이동 
    }
  };

  /* 채팅 엔터키로 입력하는 부분 */
  const onKeyDown = (e) => {
    if (e.target.value.length !== 0 && e.key === "Enter") {
      handleSendMessage();
    }
  };

  /* 스크롤을 밑으로 */
  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  
  return (
    <RoomContainer>
      <TopContainer>
        <Header>
          <button className="back_btn" onClick={() => navigate(-1)}>
            <FontAwesomeIcon icon={faArrowLeft} size="2x" />
          </button>
          <TitleContainer>
            <Title>{roomdata && roomdata.data.chatRoomData.companion_post.title}</Title>
            <FontAwesomeIcon icon={faUser} size="1x" color="#8F9098"/>
            <Person>{roomdata && roomdata.data.chatRoomData.user_chats.length}</Person>
          </TitleContainer>
          
          <button className="bars_btn" > 
            <FontAwesomeIcon icon={faBars} size="2x" onClick={openModal}/> 
          </button>
          {isModalOpen && (
            <ModalBackground onClick={handleOutsideClick}>
              <ModalBox onClick={(e) => e.stopPropagation()}>
                {roomdata && (
                  <ModalTitle>
                    참여중인 대화자 {roomdata.data.chatRoomData.user_chats.length}
                  </ModalTitle>
                )}
                <div>
                  {roomdata && roomdata.data.chatRoomData.user_chats.map((list, index) => (
                    <People key={index}>
                      <ModalPeople>{list.userID}</ModalPeople>
                    </People>
                    ))}
                </div>
              </ModalBox>
            </ModalBackground>
          )}
        </Header>
        
      </TopContainer>

      {/* 채팅내역 부분 */}
      <MidContainer>

      {/* 이전의 채팅을 가져오는 부분 */}
      {messageData && [...messageData.data.chatMessage.rows].reverse().map((prevchat, index) => {
        // 이전의 채팅에서 userID와 채팅방의 정보에서 가져온 userID가 일치하면 사진을 matchedUser에 담는다.
        const matchedUser = roomdata && roomdata.data.chatRoomData.user_chats.find(user => user.userID === prevchat.userID);
        const profileImage = matchedUser?.User?.profileImage;
      
        return (
        <ChatContainer key={index}>
          {profileImage && <img src={`${baseURL}${profileImage.replace(/\\/g, "/")}`} alt="Profile" />}
            <MessageContainer>
              <UserID>{prevchat.userID}</UserID>
              <ChatContent>{prevchat.content}</ChatContent>
            </MessageContainer>
        </ChatContainer>
      
          );
      })}


      {/* 내가 입력하는 부분 */}
      {messages.map((message, index) => (
        <ChatContainer key={index} self={message.self}>
          <ChatMessage self={message.self}>{message.text}</ChatMessage>
        </ChatContainer>
      ))}
      <div ref={endOfMessagesRef} />
      </MidContainer>


      {/* 채팅입력 부분 */}
      <BottomContainer>
        <InputContainer>
          <ChatInput type="text" placeholder="메시지 입력" value={inputValue} onChange={handleInputChange} onKeyDown={onKeyDown} />
          <SendButton onClick={handleSendMessage}>
            <FontAwesomeIcon icon={faPaperPlane} />
          </SendButton>
        </InputContainer>
      </BottomContainer>
    </RoomContainer>
  );
};

const RoomContainer = styled.div`
  
`

const TopContainer = styled.div`
  position: relative;
  box-sizing: border-box;
  height: auto;
  overflow-y: auto;
`;

const Header = styled.div`
  position: fixed;
  top: 0;
  width: 640px;
  height: 70px;
  z-index: 100; // Optional: ensure the header is always on top
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #dadada;
  background-color: white;

  button.back_btn {
    border: none;
    color: #f97800;
    cursor: pointer;
    background-color: white;

    margin: 20px;
  
  }


  button.bars_btn{
    border: none;
    color: #f97800;
    cursor: pointer;
    background-color: white;

    margin: 20px;

  }


`;

const TitleContainer = styled.div`
  display:flex;
  align-items:center;
  justify-content: center;
`

const Title = styled.h2`
  margin-right:15px;
`
const Person = styled.div`
  margin-left: 5px;
  color: #8F9098;

`


const ModalBackground = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center; // 센터 정렬
  align-items: center; // 센터 정렬
  padding: 20px; // 여백 추가
`;

const ModalBox = styled.div`
  width: 400px;
  height: 500px;
  padding: 10px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
`;

const ModalTitle = styled.div`
 margin: 5px 0px 10px 5px;
`

const People = styled.div`
display:flex;
flex-direction:column;

`

const ModalPeople = styled.div`
margin:5px 0px 10px 5px;
`


// const ModalButton = styled.div`
// box-sizing: border-box;
// appearance: none;
// background-color: transparent;
// border-radius: 0.6em;
// color: #f97800;
// cursor: pointer;
// align-self: center;
// font-size: 16px;
// font-family: "Nanum Gothic", sans-serif;
// line-height: 1;
// padding: 0.6em 2em;
// text-decoration: none;
// letter-spacing: 2px;
// font-weight: 700;
// margin-bottom: 10px;

// &:hover,
// &:focus {
//   color: #fff;
//   outline: 0;
// }
// transition: box-shadow 300ms ease-in-out, color 300ms ease-in-out;
// &:hover {
//   box-shadow: 0 0 40px 40px #f97800 inset;
// }

// &:focus:not(:hover) {
//   color: #f97800;
//   box-shadow: none;
// }
// }
// `;


const MidContainer = styled.div`
margin-top: 75px; 
margin-bottom: 85px;
`


const ChatMessage = styled.div`
  display: inline-block;
  background-color: ${(props) => (props.self ? "#FFEB3B" : "#ffffff")};
  border: 1px solid ${(props) => (props.self ? "#FFEB3B" : "#E0E0E0")};
  border-radius: 12px;
  padding: 10px;
  margin: 10px;
  max-width: 85%;
  word-break: break-word;
`;

const ChatContainer = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  padding: 5px;
  justify-content: ${(props) => (props.self ? "flex-end" : "flex-start")};
  
  img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    margin: ${(props) => (props.self ? "0 0 5px 15px" : "0 15px 5px 0")};
  }
`;

const MessageContainer = styled.div`
    display: flex;
    flex-direction: column;
`;

const UserID = styled.span`
    font-size: 12px;  // 이 값을 원하는대로 조절하여 ID의 글자 크기를 조정할 수 있습니다.
    color: #888;  // ID의 글자색을 조절하고 싶다면 이 값을 변경하세요.
    margin-bottom: 5px;  // ID와 메시지 사이의 간격을 조절하고 싶다면 이 값을 변경하세요.
`;

const ChatContent = styled.div`
    background-color: ${(props) => (props.self ? "#FFEB3B" : "#ffffff")};
    border: 1px solid ${(props) => (props.self ? "#FFEB3B" : "#E0E0E0")};
    border-radius: 12px;
    padding: 10px;
    margin: 5px;
    max-width: 85%;
    word-break: break-word;
`;

const BottomContainer = styled.div`
  position: fixed;
  bottom: 0;
  width: 640px;
  height: 80px;
  display: flex;
  justify-content: center;
  padding: 10px;
  background-color: white;
  border-top: 1px solid #dadada;
  box-sizing: border-box;
`;

const InputContainer = styled.div`
  display: flex;
  width: 90%;
  background-color: #f1f3f5;
  border-radius: 0.6rem;
  padding: 0.5rem;
`;

const ChatInput = styled.input`
  flex-grow: 1;
  border: none;
  background-color: #E1E1E1; // lighter gray for input
  outline: none;
  border-radius: 18px;
  padding: 0 12px;
`;

const SendButton = styled.button`
  background-color: transparent;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #f97800;
`;




export default ChattingRoom;