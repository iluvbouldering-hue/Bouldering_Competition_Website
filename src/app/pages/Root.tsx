import { Outlet } from 'react-router';
import { TimerButton } from '../components/TimerButton';

export default function Root() {
  return (
    <>
      <Outlet />
      <TimerButton />
    </>
  );
}
