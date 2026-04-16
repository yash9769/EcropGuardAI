import React from 'react';
import { useTranslation } from 'react-i18next';

const UploadPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">{t('image_upload')}</h1>
      <p>{t('upload_crop_coming_soon')}</p>
    </div>
  );
};

export default UploadPage;

