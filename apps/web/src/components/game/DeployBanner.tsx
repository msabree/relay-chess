import { useDeployPhase } from '@/lib/deployWindow';

/** Shown on the game page around the weekly deployment window. */
const DeployBanner = () => {
  const phase = useDeployPhase();
  if (!phase) return null;
  return (
    <div role="status" className="border-b border-line bg-accent/15 px-4 py-2 text-center text-sm">
      {phase === 'soon' ? (
        <>
          <span className="font-semibold">Deployments and maintenance happen Fridays at 12 AM ET.</span> Games may reset
          between 12:00 and 12:15 AM.
        </>
      ) : (
        <>
          <span className="font-semibold">We&apos;re doing weekly deployments and maintenance.</span> Games{' '}
          <strong>
            <em>may</em>
          </strong>{' '}
          reset.
        </>
      )}
    </div>
  );
};

export default DeployBanner;
