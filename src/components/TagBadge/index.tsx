import React from 'react';
import { Text } from '@tarojs/components';
import classNames from 'classnames';
import styles from './index.module.scss';

interface TagBadgeProps {
  label: string;
  tone?: 'default' | 'primary' | 'warning' | 'success' | 'dark';
}

const TagBadge: React.FC<TagBadgeProps> = ({ label, tone = 'default' }) => {
  return <Text className={classNames(styles.badge, styles[tone])}>{label}</Text>;
};

export default TagBadge;
