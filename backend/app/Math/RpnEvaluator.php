<?php

namespace App\Math;

class RpnEvaluator
{
    public function evaluate(array $rpn): float
    {
        $stack = [];

        foreach ($rpn as $t) {
            if (is_float($t)) {
                $stack[] = $t;
                continue;
            }

            if ($t === 'sqrt') {
                $a = array_pop($stack);
                if ($a < 0) throw new \InvalidArgumentException('sqrt() of negative number');
                $stack[] = sqrt($a);
                continue;
            }

            $b = array_pop($stack);
            $a = array_pop($stack);
            if ($a === null || $b === null) throw new \InvalidArgumentException('Invalid expression');

            switch ($t) {
                case '+':
                    $stack[] = $a + $b;
                    break;
                case '-':
                    $stack[] = $a - $b;
                    break;
                case '*':
                    $stack[] = $a * $b;
                    break;
                case '/':
                    if (abs($b) < 1e-18) throw new \InvalidArgumentException('Division by zero');
                    $stack[] = $a / $b;
                    break;
                case '^':
                    $stack[] = $a ** $b;
                    break;
                default:
                    throw new \InvalidArgumentException("Unknown operator {$t}");
            }
        }

        if (count($stack) !== 1) throw new \InvalidArgumentException('Invalid expression');
        return $stack[0];
    }
}
