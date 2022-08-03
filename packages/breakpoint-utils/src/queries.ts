type BuildOptions = {
  min?: string | null;
  max?: string | null;
};

function buildQuery({ min, max }: BuildOptions) {
  return [min && `(min-width: ${min})`, max && `(max-width: ${max})`].filter(Boolean).join(' and ');
}

export function queries({ name, min, max }: BuildOptions & { name: string }) {
  return {
    name,
    minQuery: buildQuery({ min }),
    maxQuery: buildQuery({ max }),
    minMaxQuery: buildQuery({ min, max }),
  };
}
