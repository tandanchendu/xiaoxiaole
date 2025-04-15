export interface levelConfig{
    level:number,
    targetScore:number,
    stepCount:number,
    itemScore:number,
    score:number
}
// 100+level*100 60 5+level
export class config{
    level=[
        [100,60,5],
        [100,60,5],
        [100,60,5],
        [100,60,5],
        [100,60,5],
        [100,60,5],
        [100,60,5],
    ]
}