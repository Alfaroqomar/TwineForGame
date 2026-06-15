import * as React from 'react';
//import {useTranslation} from 'react-i18next';
import { IconButton } from '../../../components/control/icon-button';
import { IconBookUpload } from '@tabler/icons';
import './publish-changes-button.css';



export const PublishChangesButton: React.FC = () => {
    // const {t} = useTranslation();

    return (
        <div className="publish-changes-button">
            <IconButton
                icon={<IconBookUpload />}
                label={'Publish Changes'} // no translation for this yet
                onClick={() => {}} // On click change icon to spinner and disable action until publish is done
            />
        </div>
    );
}