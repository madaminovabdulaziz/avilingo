"""
Cloud Storage Service

Handles file uploads to S3-compatible storage (AWS S3 or MinIO).
Supports:
- Audio file uploads for speaking submissions
- Pre-signed URL generation for secure uploads/downloads
- File deletion
"""

import uuid
import logging
from typing import Optional, Tuple
from datetime import datetime
from io import BytesIO

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

from app.core.config import settings

logger = logging.getLogger(__name__)


class StorageService:
    """
    Service for cloud storage operations.
    
    Supports both AWS S3 and MinIO (S3-compatible).
    """
    
    def __init__(self):
        """Initialize S3 client with configuration."""
        self._client = None
        self._bucket = settings.AWS_S3_BUCKET
        self._region = settings.AWS_S3_REGION
        self._public_url = settings.AWS_S3_PUBLIC_URL
    
    @property
    def client(self):
        """Lazy-load S3 client."""
        if self._client is None:
            config = Config(
                signature_version='s3v4',
                retries={'max_attempts': 3, 'mode': 'standard'}
            )
            
            client_kwargs = {
                'service_name': 's3',
                'region_name': self._region,
                'config': config,
            }
            
            # Add credentials if provided
            if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
                client_kwargs['aws_access_key_id'] = settings.AWS_ACCESS_KEY_ID
                client_kwargs['aws_secret_access_key'] = settings.AWS_SECRET_ACCESS_KEY
            
            # Custom endpoint for MinIO or other S3-compatible services
            if settings.AWS_S3_ENDPOINT_URL:
                client_kwargs['endpoint_url'] = settings.AWS_S3_ENDPOINT_URL
            
            self._client = boto3.client(**client_kwargs)
            logger.info(f"S3 client initialized for bucket: {self._bucket}")
        
        return self._client
    
    def _generate_key(
        self,
        user_id: str,
        file_type: str,
        file_extension: str,
        submission_id: Optional[str] = None
    ) -> str:
        """
        Generate a unique S3 key for the file.
        
        Format: {file_type}/{user_id}/{date}/{submission_id}.{extension}
        Example: submissions/abc123/2025-01-15/def456.webm
        """
        date_prefix = datetime.utcnow().strftime('%Y-%m-%d')
        file_id = submission_id or str(uuid.uuid4())
        
        return f"{file_type}/{user_id}/{date_prefix}/{file_id}.{file_extension}"
    
    # =========================================================================
    # Upload Operations
    # =========================================================================
    
    async def upload_audio(
        self,
        file_content: bytes,
        user_id: str,
        submission_id: str,
        file_extension: str,
        content_type: str = "audio/webm"
    ) -> Tuple[bool, str, str]:
        """
        Upload audio file to S3.
        
        Args:
            file_content: Raw file bytes
            user_id: User's ID
            submission_id: Speaking submission ID
            file_extension: File extension (webm, mp3, wav, m4a)
            content_type: MIME type of the file
            
        Returns:
            Tuple of (success, url, error_message)
        """
        key = self._generate_key(
            user_id=user_id,
            file_type="submissions",
            file_extension=file_extension,
            submission_id=submission_id
        )
        
        try:
            self.client.put_object(
                Bucket=self._bucket,
                Key=key,
                Body=BytesIO(file_content),
                ContentType=content_type,
                Metadata={
                    'user_id': user_id,
                    'submission_id': submission_id,
                    'uploaded_at': datetime.utcnow().isoformat()
                }
            )
            
            # Generate URL
            url = self._get_public_url(key)
            logger.info(f"Audio uploaded successfully: {key}")
            
            return True, url, ""
            
        except ClientError as e:
            error_msg = str(e)
            logger.error(f"Failed to upload audio: {error_msg}")
            return False, "", error_msg
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Unexpected error uploading audio: {error_msg}")
            return False, "", error_msg
    
    async def upload_file(
        self,
        file_content: bytes,
        key: str,
        content_type: str,
        metadata: Optional[dict] = None
    ) -> Tuple[bool, str, str]:
        """
        Upload a generic file to S3.
        
        Args:
            file_content: Raw file bytes
            key: S3 key (path) for the file
            content_type: MIME type
            metadata: Optional metadata dict
            
        Returns:
            Tuple of (success, url, error_message)
        """
        try:
            put_kwargs = {
                'Bucket': self._bucket,
                'Key': key,
                'Body': BytesIO(file_content),
                'ContentType': content_type,
            }
            
            if metadata:
                put_kwargs['Metadata'] = {k: str(v) for k, v in metadata.items()}
            
            self.client.put_object(**put_kwargs)
            
            url = self._get_public_url(key)
            return True, url, ""
            
        except ClientError as e:
            return False, "", str(e)
    
    # =========================================================================
    # Pre-signed URLs
    # =========================================================================
    
    def generate_upload_url(
        self,
        user_id: str,
        submission_id: str,
        file_extension: str,
        content_type: str = "audio/webm",
        expires_in: int = 3600
    ) -> Tuple[str, str, dict]:
        """
        Generate a pre-signed URL for direct client upload.
        
        This allows the frontend to upload directly to S3 without
        going through our backend, reducing server load.
        
        Args:
            user_id: User's ID
            submission_id: Speaking submission ID
            file_extension: Expected file extension
            content_type: Expected MIME type
            expires_in: URL expiration in seconds (default 1 hour)
            
        Returns:
            Tuple of (upload_url, object_key, fields)
        """
        key = self._generate_key(
            user_id=user_id,
            file_type="submissions",
            file_extension=file_extension,
            submission_id=submission_id
        )
        
        try:
            # Generate pre-signed POST URL
            response = self.client.generate_presigned_post(
                Bucket=self._bucket,
                Key=key,
                Fields={
                    'Content-Type': content_type,
                },
                Conditions=[
                    {'Content-Type': content_type},
                    ['content-length-range', 1, 10 * 1024 * 1024],  # 1 byte to 10MB
                ],
                ExpiresIn=expires_in
            )
            
            return response['url'], key, response['fields']
            
        except ClientError as e:
            logger.error(f"Failed to generate upload URL: {e}")
            raise
    
    def generate_download_url(
        self,
        key: str,
        expires_in: int = 3600
    ) -> Optional[str]:
        """
        Generate a pre-signed URL for downloading a file.
        
        Args:
            key: S3 object key
            expires_in: URL expiration in seconds
            
        Returns:
            Pre-signed URL or None if failed
        """
        try:
            url = self.client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self._bucket,
                    'Key': key
                },
                ExpiresIn=expires_in
            )
            return url
        except ClientError as e:
            logger.error(f"Failed to generate download URL: {e}")
            return None
    
    # =========================================================================
    # URL Helpers
    # =========================================================================
    
    def _get_public_url(self, key: str) -> str:
        """
        Get public URL for an object.
        
        Uses custom public URL if configured (CDN), otherwise
        constructs standard S3 URL.
        """
        if self._public_url:
            return f"{self._public_url.rstrip('/')}/{key}"
        
        if settings.AWS_S3_ENDPOINT_URL:
            # MinIO or custom endpoint
            return f"{settings.AWS_S3_ENDPOINT_URL}/{self._bucket}/{key}"
        
        # Standard AWS S3 URL
        return f"https://{self._bucket}.s3.{self._region}.amazonaws.com/{key}"
    
    def extract_key_from_url(self, url: str) -> Optional[str]:
        """Extract S3 key from a full URL."""
        if not url:
            return None
        
        # Handle different URL formats
        if self._public_url and url.startswith(self._public_url):
            return url[len(self._public_url):].lstrip('/')
        
        if f"{self._bucket}/" in url:
            return url.split(f"{self._bucket}/", 1)[-1]
        
        return None
    
    # =========================================================================
    # Delete Operations
    # =========================================================================
    
    async def delete_file(self, key: str) -> bool:
        """
        Delete a file from S3.
        
        Args:
            key: S3 object key
            
        Returns:
            True if deleted successfully
        """
        try:
            self.client.delete_object(
                Bucket=self._bucket,
                Key=key
            )
            logger.info(f"Deleted file: {key}")
            return True
        except ClientError as e:
            logger.error(f"Failed to delete file: {e}")
            return False
    
    async def delete_audio(self, url: str) -> bool:
        """
        Delete an audio file by URL.
        
        Args:
            url: Full URL of the audio file
            
        Returns:
            True if deleted successfully
        """
        key = self.extract_key_from_url(url)
        if key:
            return await self.delete_file(key)
        return False
    
    # =========================================================================
    # Utility Methods
    # =========================================================================
    
    def file_exists(self, key: str) -> bool:
        """Check if a file exists in S3."""
        try:
            self.client.head_object(Bucket=self._bucket, Key=key)
            return True
        except ClientError:
            return False
    
    def get_file_info(self, key: str) -> Optional[dict]:
        """Get metadata about a file."""
        try:
            response = self.client.head_object(Bucket=self._bucket, Key=key)
            return {
                'size': response['ContentLength'],
                'content_type': response['ContentType'],
                'last_modified': response['LastModified'],
                'metadata': response.get('Metadata', {})
            }
        except ClientError:
            return None
    
    async def ensure_bucket_exists(self) -> bool:
        """Ensure the S3 bucket exists, create if not."""
        try:
            self.client.head_bucket(Bucket=self._bucket)
            return True
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', '')
            
            if error_code == '404':
                # Bucket doesn't exist, create it
                try:
                    if self._region == 'us-east-1':
                        self.client.create_bucket(Bucket=self._bucket)
                    else:
                        self.client.create_bucket(
                            Bucket=self._bucket,
                            CreateBucketConfiguration={
                                'LocationConstraint': self._region
                            }
                        )
                    logger.info(f"Created bucket: {self._bucket}")
                    return True
                except ClientError as create_error:
                    logger.error(f"Failed to create bucket: {create_error}")
                    return False
            else:
                logger.error(f"Failed to check bucket: {e}")
                return False


# Singleton instance
storage_service = StorageService()


# Convenience functions
async def upload_speaking_audio(
    file_content: bytes,
    user_id: str,
    submission_id: str,
    file_extension: str,
    content_type: str = "audio/webm"
) -> Tuple[bool, str, str]:
    """Upload speaking audio file."""
    return await storage_service.upload_audio(
        file_content=file_content,
        user_id=user_id,
        submission_id=submission_id,
        file_extension=file_extension,
        content_type=content_type
    )


def get_upload_url(
    user_id: str,
    submission_id: str,
    file_extension: str = "webm"
) -> Tuple[str, str, dict]:
    """Get pre-signed upload URL for speaking audio."""
    return storage_service.generate_upload_url(
        user_id=user_id,
        submission_id=submission_id,
        file_extension=file_extension
    )

