import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { EntryForm } from '@/src/components/add-entry/EntryForm';

export default function EditEntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EntryForm id={id} />;
}
