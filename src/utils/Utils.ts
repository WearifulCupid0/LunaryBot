import Eris, { Member } from "eris";

class Utils {
    public static formatSizeUnits(bytes: number | string): string {
        if (typeof bytes === 'string') {
            bytes = parseInt(bytes, 10);
        };

        if (bytes >= 1000000000000000000000000) {
            bytes = (bytes / 1000000000000000000000000).toFixed(1) + 'YB';
        } else if (bytes >= 1000000000000000000000) {
            bytes = (bytes / 1000000000000000000000).toFixed(1) + 'ZB';
        } else if (bytes >= 1000000000000000000) {
            bytes = (bytes / 1000000000000000000).toFixed(1) + 'EB';
        } else if (bytes >= 1000000000000000) {
            bytes = (bytes / 1000000000000000).toFixed(1) + 'PB';
        } else if (bytes >= 1000000000000) {
            bytes = (bytes / 1000000000000).toFixed(1) + 'TB';
        } else if (bytes >= 1000000000) {
            bytes = (bytes / 1000000000).toFixed(1) + 'GB';
        } else if (bytes >= 1000000) {
            bytes = (bytes / 1000000).toFixed(1) + 'MB';
        } else if (bytes >= 1000) {
            bytes = (bytes / 1000).toFixed(1) + 'KB';
        } else if (bytes > 1) {
            bytes = bytes + ' bytes';
        } else if (bytes == 1) {
            bytes = bytes + ' byte';
        } else {
            bytes = '0 bytes';
        };

        return bytes;
    };

    public static highestPosition(member1: Eris.Member, member2: Eris.Member) {
        if (member1.id == member2.id || member1.guild.ownerID == member1.id) { return true };
        if(member1.guild.ownerID == member2.id) { return false };

        const roles = [ ...member1.guild.roles.values() ].sort((a, b) => b.position - a.position);

        member1.roles.sort((a, b) => roles.findIndex(role => role.id == a) - roles.findIndex(role => role.id == b));
        member2.roles.sort((a, b) => roles.findIndex(role => role.id == a) - roles.findIndex(role => role.id == b));

        return roles.findIndex(role => role.id == member1.roles[0]) > roles.findIndex(role => role.id == member2.roles[0]);
    }
}

export default Utils;