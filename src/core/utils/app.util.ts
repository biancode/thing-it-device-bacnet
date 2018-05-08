export { unitOfTime } from 'moment';

export class AppUtil {

    /**
     * Convert time with specific units to the milliseconds.
     *
     * @param  {number} timeValue - value of the time
     * @param  {string} timeUnit - units of the time
     * @return {number} - milliseconds
     */
    static timeToMs (timeValue: number, timeUnit: string): number {
        let time = 0;

        const msFromSeconds = 1000;
        const msFromMinutes = msFromSeconds * 60;
        const msFromHours = msFromMinutes * 60;
        const msFromDays = msFromHours * 24;

        switch (timeUnit) {
            case  'millisecond': case 'milliseconds': case 'ms':
                time = timeValue;
                break;
            case 'second': case 'seconds': case 's':
                time = timeValue * msFromSeconds;
                break;
            case 'minute': case 'minutes': case 'm':
                time = timeValue * msFromMinutes;
                break;
            case 'hour': case 'hours': case 'h':
                time = timeValue * msFromHours;
                break;
            case 'day': case 'days': case 'd':
                time = timeValue * msFromDays;
                break;
        }

        return Math.round(time);
    }
}
