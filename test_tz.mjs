import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

let rawDate = "2026-07-27 11:00:00";
let dateObj = dayjs.tz(rawDate, "UTC");
console.log("Parsed UTC:", dateObj.format("YYYY-MM-DD HH:mm:ss"));

dateObj = dateObj.subtract(3, 'days');
dateObj = dateObj.subtract(15, 'minutes');
console.log("Subtracted:", dateObj.format("YYYY-MM-DD HH:mm:ss"));

let targetObj = dateObj.tz("Asia/Kolkata");
console.log("Target IST:", targetObj.format("YYYY-MM-DD HH:mm:ss"));
