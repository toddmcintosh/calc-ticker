<?php

namespace App\Math;

class ShuntingYard
{
    private array $precedence = [
        '+' => 1,
        '-' => 1,
        '*' => 2,
        '/' => 2,
        '^' => 3,
    ];

    private array $rightAssociative = [
        '^' => true,
    ];

    public function toRpn(array $tokens): array
    {
        $output = [];
        $stack = [];

        foreach ($tokens as $t) {
            if (is_float($t)) {
                $output[] = $t;
                continue;
            }

            if ($t === 'sqrt') {
                $stack[] = $t;
                continue;
            }

            if (isset($this->precedence[$t])) {
                while ($stack) {
                    $top = end($stack);
                    if (
                        isset($this->precedence[$top]) &&
                        (
                            $this->precedence[$top] > $this->precedence[$t] ||
                            ($this->precedence[$top] === $this->precedence[$t] && empty($this->rightAssociative[$t]))
                        )
                    ) {
                        $output[] = array_pop($stack);
                    } else break;
                }
                $stack[] = $t;
                continue;
            }

            if ($t === '(') {
                $stack[] = $t;
                continue;
            }

            if ($t === ')') {
                while ($stack && end($stack) !== '(') {
                    $output[] = array_pop($stack);
                }
                if (!$stack) throw new \InvalidArgumentException('Mismatched parentheses');
                array_pop($stack);

                if ($stack && end($stack) === 'sqrt') {
                    $output[] = array_pop($stack);
                }
                continue;
            }
        }

        while ($stack) {
            $op = array_pop($stack);
            if ($op === '(') throw new \InvalidArgumentException('Mismatched parentheses');
            $output[] = $op;
        }

        return $output;
    }
}
