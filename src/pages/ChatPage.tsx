import React from 'react';
import { useTranslation } from 'react-i18next';

const ChatPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">{t('chat_interface')}</h1>
      <p>{t('chat_coming_soon')}</p>
    </div>
  );
};

export default ChatPage;

