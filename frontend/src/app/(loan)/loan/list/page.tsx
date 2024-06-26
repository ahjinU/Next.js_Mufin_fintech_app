'use client';

import {
  FlexBox,
  MoneyInfoElement,
  MoneyShow,
  OtherInfoElement,
} from '@/components';
import { commaNum } from '@/utils/commaNum';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import useFetch from '@/hooks/useFetch';
import { LoanType } from '../_types';

export default function LoanList() {
  const { postFetch } = useFetch();
  const [loanReminder, setLoanReminder] = useState();

  const [LoansList, setLoansList] = useState<LoanType[]>();

  useEffect(() => {
    const fetchLoanData = async () => {
      try {
        const res = await postFetch({ api: '/loan/total/child' });
        if (res?.data) {
          setLoanReminder(res?.data?.totalRemainderAmount);
          setLoansList(res?.data?.loansList);
        }
        console.log(res);
      } catch (error) {
        console.error(' 대출 신청 가져오기 에러', error);
      }
    };
    fetchLoanData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-[1rem]">
      <MoneyShow
        mode={'UNDIVIDED'}
        text={['남은 대출금']}
        money={[commaNum(loanReminder)]}
        unit={'원'}
      />
      <div className="flex flex-row items-end justify-end gap-[1rem]">
        <div className="flex flex-row items-center gap-[0.3rem]">
          <Image
            src={'/images/icon-repay-smile.png'}
            width={200}
            height={200}
            alt={'정상 납부 중'}
            className="w-[2rem] h-[2rem]"
          />
          <p className="custom-light-text text-custom-dark-purple">
            정상 납부 중
          </p>
        </div>
        <div className="flex flex-row items-center gap-[0.3rem]">
          <Image
            src={'/images/icon-repay-sad.png'}
            width={200}
            height={200}
            alt={'연체 횟수 남음'}
            className="w-[2rem] h-[2rem]"
          />
          <p className="custom-light-text text-custom-red">연체 횟수 남음</p>
        </div>
      </div>
      {!LoansList || LoansList?.length === 0 ? (
        <p className="custom-semibold-text text-custom-medium-gray mx-auto  mt-[2rem]">
          신청한 대출이 없습니다.
        </p>
      ) : (
        LoansList?.map((loan) => {
          return loan.loanRefusalReason ? (
            <FlexBox
              isDivided={true}
              topChildren={
                <div className="px-[1.2rem] my-[-1rem]">
                  <OtherInfoElement
                    leftExplainText={`${commaNum(loan.amount)}원`}
                    leftHighlightText={loan.reason}
                    rightHighlightText="거절"
                    state={'UP'}
                  />
                </div>
              }
              bottomChildren={
                <div className="flex flex-row gap-[1rem] px-[1.2rem] my-[-0.5rem] mb-[-1rem] justify-between custom-medium-text items-center">
                  <p className="text-custom-red w-[8rem]">거절 사유</p>
                  <p className="text-custom-black font-[300] text-[1.4rem] text-right leading-[1.5rem]">
                    {loan.loanRefusalReason}
                  </p>
                </div>
              }
            />
          ) : loan.status !== '심사중' ? (
            <FlexBox
              isDivided={false}
              topChildren={
                <MoneyInfoElement
                  imageSrc={
                    loan.overDueCnt > 0
                      ? '/images/icon-repay-sad.png'
                      : '/images/icon-repay-smile.png'
                  }
                  leftHighlightText={`잔금 ${commaNum(
                    loan.remainderAmount,
                  )}원/ 총 ${commaNum(loan.amount)}원`}
                  leftExplainText={loan.reason}
                  buttonOption={'TINY_BUTTON'}
                  tinyButtonLabel={`납부하기`}
                  link={`${loan.loanUuid}/detail`}
                />
              }
            />
          ) : (
            <FlexBox
              isDivided={false}
              topChildren={
                <div className="px-[1.2rem] my-[-1rem]">
                  <OtherInfoElement
                    leftExplainText={`${commaNum(loan.amount)}원`}
                    leftHighlightText={loan.reason}
                    rightHighlightText="심사중"
                    state={'UP'}
                  />
                </div>
              }
            />
          );
        })
      )}
    </div>
  );
}
