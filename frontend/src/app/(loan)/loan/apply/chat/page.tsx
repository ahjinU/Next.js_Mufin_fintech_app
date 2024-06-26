'use client';

import { BackButton, GuideText, Header, ProgressBar } from '@/components';
import ChatBox from '@/components/ChatBox/ChatBox';
import { ArrowPathIcon } from '@heroicons/react/24/solid';
import ChatArea from './ChatArea';
import useUserStore from '@/app/_store/store';
import { useRouter } from 'next/navigation';

export default function LoanApplyChat() {
  const router = useRouter();
  const { userData } = useUserStore();

  const userName = userData?.name;
  return (
    <div>
      <Header>
        <BackButton label={'대출 신청하기'} />
      </Header>
      <div className="p-[1.2rem] gap-[0.5rem] flex flex-col w-full">
        <div className="flex flex-col gap-[1rem] mb-[1.5rem]">
          <GuideText
            text={
              <div>
                <span>
                  챗봇이 세 개의 질문을 할거에요 성실하게 대답해주세요!
                  <br /> 대화 내용은 부모님께 보내지고, 심사하는데 이용됩니다.
                </span>
              </div>
            }
          />
          <ProgressBar barGage={60} />
        </div>
        <div className="flex flex-row w-full items-center justify-end gap-[0.5rem] mb-[0.5rem]">
          <p className="text-custom-purple">다시 처음부터 대화하기</p>
          <ArrowPathIcon
            className="text-custom-purple w-[1.5rem]"
            onClick={() => {
              window.location.reload();
            }}
          />
        </div>
        <ChatBox
          mode={'BOT'}
          message={
            <>
              {`안녕하세요 ${userName}님!`}
              <br />
              대출이 필요하다는 소식을 들었습니다.
              <br /> <br />
              부모님의 심사가 있기 전에, 저와 대화를 나누어야 합니다. <br />{' '}
              <br />
              대화를 하다보면 <br />
              대출이 정말 필요하다고 느낄 수도 있고, 생각해보니 필요없을 수도
              있어요. <br /> <br />
              저에게 진심을 보여주시면, 제가 부모님께 잘 전달해드릴게요!
            </>
          }
        />
        <ChatArea />
      </div>
    </div>
  );
}
