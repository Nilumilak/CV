import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { chapters, profile } from '@/data/cv';
import { IslandPanel } from './IslandPanel';

describe('IslandPanel', () => {
  it.each(chapters.map((c) => [c.id, c] as const))(
    'lists every achievement for %s',
    (id, chapter) => {
      render(<IslandPanel id={id} />);
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(chapter.role);
      for (const a of chapter.achievements) {
        expect(screen.getByText(a.title)).toBeInTheDocument();
        expect(screen.getByText(a.text)).toBeInTheDocument();
      }
    },
  );

  it('shows contacts and skills on Home', () => {
    render(<IslandPanel id="home" />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(profile.name);
    expect(screen.getByRole('link', { name: profile.contacts.email })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
  });
});
