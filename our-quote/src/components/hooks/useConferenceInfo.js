import { useEffect, useState } from 'react';

export function useConferenceInfo() {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    fetch('http://scientific-conference-backend.tutik/api/conference-info/')
      .then(r => r.json())
      .then(setInfo)
      .catch(() => {});
  }, []);

  return info;
}