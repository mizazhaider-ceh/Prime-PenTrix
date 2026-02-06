'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Subject } from '@/types';
import { BookOpen, Users, GraduationCap, ArrowRight } from 'lucide-react';

interface SubjectCardProps {
  subject: Subject;
}

export function SubjectCard({ subject }: SubjectCardProps) {
  return (
    <Link href={`/workspace/${subject.slug}`}>
      <Card
        className="animate-fade-in-up group relative overflow-hidden transition-all duration-300 hover:scale-[1.03] glass border border-border/30 rounded-2xl"
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] opacity-60 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `linear-gradient(90deg, transparent, ${subject.color}, transparent)`,
          }}
        />

        {/* Glow effect on hover */}
        <div
          className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${subject.color}15, transparent 70%)`,
          }}
        />

        {/* Content */}
        <div className="relative p-6">
          {/* Header */}
          <div className="mb-4 flex items-start justify-between">
            <div className="flex-1">
              <h3 className="mb-1 font-outfit text-lg font-bold transition-colors duration-300 group-hover:text-foreground" style={{ color: subject.color }}>
                {subject.name}
              </h3>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{subject.code}</p>
            </div>
            <Badge
              variant="secondary"
              className="ml-2 rounded-lg border text-[10px] font-semibold"
              style={{ 
                borderColor: `${subject.color}30`, 
                backgroundColor: `${subject.color}12`, 
                color: subject.color 
              }}
            >
              {subject.credits} CR
            </Badge>
          </div>

          {/* Description */}
          <p className="mb-5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{subject.description}</p>

          {/* Meta Info */}
          <div className="space-y-2.5 border-t border-border/30 pt-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5" style={{ color: subject.color }} />
              <span>{subject.topics.length} topics</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" style={{ color: subject.color }} />
              <span className="line-clamp-1">{subject.teachers.join(', ')}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <GraduationCap className="h-3.5 w-3.5" style={{ color: subject.color }} />
              <span>{subject.examType}</span>
            </div>
          </div>

          {/* Enter indicator */}
          <div className="mt-4 flex items-center gap-1 text-xs font-medium opacity-0 transition-all duration-300 group-hover:opacity-100" style={{ color: subject.color }}>
            <span>Enter workspace</span>
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </Card>
    </Link>
  );
}
