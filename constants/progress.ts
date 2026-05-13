export type ProgressMessage = {
  headline: string;
  subtitle: string;
};

export function getProgressMessage(percent: number): ProgressMessage {
  if (percent <= 0) {
    return {
      headline: '0% complete',
      subtitle: 'Start with one habit today.',
    };
  }

  if (percent < 50) {
    return {
      headline: `${percent}% complete`,
      subtitle: 'Small progress still counts.',
    };
  }

  if (percent < 100) {
    return {
      headline: `${percent}% complete`,
      subtitle: 'Keep the rhythm going.',
    };
  }

  return {
    headline: '100% complete',
    subtitle: 'All tracked habits are done.',
  };
}
