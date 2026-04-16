import React from 'react';
import { useTranslation } from 'react-i18next';

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">{t('dashboard_title')}</h1>
      <p>{t('dashboard_coming_soon')}</p>
    </div>
  );
};

export default DashboardPage;

