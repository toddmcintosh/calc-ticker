<?php

namespace App\Math;

class Tokenizer
{
    public function tokenize(string $expr): array
    {
        $expr = preg_replace('/\s+/', '', $expr);
        preg_match_all('~sqrt|(?:\d+\.?\d*|\.\d+)|[()+\-*/^]~i', $expr, $m);
        $raw = $m[0] ?? [];

        $tokens = [];
        $prev = null;

        foreach ($raw as $t) {
            $t = strtolower($t);

            if (is_numeric($t)) {
                $tokens[] = (float) $t;
                $prev = 'num';
                continue;
            }

            if ($t === 'sqrt') {
                $tokens[] = 'sqrt';
                $prev = 'func';
                continue;
            }

            if ($t === '-' && ($prev === null || $prev === 'op' || $prev === '(')) {
                // unary minus → 0 - x
                $tokens[] = 0.0;
                $tokens[] = '-';
                $prev = 'op';
                continue;
            }

            if (in_array($t, ['+', '-', '*', '/', '^'], true)) {
                $tokens[] = $t;
                $prev = 'op';
                continue;
            }

            if ($t === '(' || $t === ')') {
                $tokens[] = $t;
                $prev = $t;
                continue;
            }

            throw new \InvalidArgumentException("Invalid token: {$t}");
        }

        return $tokens;
    }
}
